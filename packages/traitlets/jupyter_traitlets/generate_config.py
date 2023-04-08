"""Traitlets configuration generation."""

from collections import OrderedDict

from traitlets.config.configurable import Configurable
from traitlets.utils.text import wrap_paragraphs


def generate_config(configurable, classes=None):
    """generate default config file from Configurables"""
    lines = [f"# Configuration file for {configurable.name}."]
    lines.append("")
    lines.append("c = get_config()  #" + "noqa")
    lines.append("")
    classes = configurable.classes if classes is None else classes
    config_classes = list(_classes_with_config_traits(configurable, classes))
    for cls in config_classes:
        lines.append(class_config_section(cls, config_classes))
    return "\n".join(lines)


def _classes_with_config_traits(self, classes=None):
    """
    Yields only classes with configurable traits, and their subclasses.

    :param classes:
        The list of classes to iterate; if not set, uses :attr:`classes`.

    Thus, produced sample config-file will contain all classes
    on which a trait-value may be overridden:

    - either on the class owning the trait,
    - or on its subclasses, even if those subclasses do not define
        any traits themselves.
    """
    if classes is None:
        classes = self.classes

    cls_to_config = OrderedDict( (cls, bool(cls.class_own_traits(config=True)))
                            for cls
                            in self._classes_inc_parents(classes))

    def is_any_parent_included(cls):
        return any(b in cls_to_config and cls_to_config[b] for b in cls.__bases__)

    ## Mark "empty" classes for inclusion if their parents own-traits,
    #  and loop until no more classes gets marked.
    #
    while True:
        to_incl_orig = cls_to_config.copy()
        cls_to_config = OrderedDict( (cls, inc_yes or is_any_parent_included(cls))
                                for cls, inc_yes
                                in cls_to_config.items())
        if cls_to_config == to_incl_orig:
            break
    for cl, inc_yes in cls_to_config.items():
        if inc_yes:
            yield cl


def class_config_section(cls, classes=None):
    """Get the config section for this class.

    Parameters
    ----------
    classes : list, optional
        The list of other classes in the config file.
        Used to reduce redundant information.
    """

    def c(s):
        """return a commented, wrapped block."""
        s = "\n\n".join(wrap_paragraphs(s, 78))

        return "## " + s.replace("\n", "\n#  ")

    # section header
    breaker = "#" + "-" * 78
    parent_classes = ", ".join(p.__name__ for p in cls.__bases__ if issubclass(p, Configurable))

    s = f"# {cls.__name__}({parent_classes}) configuration"
    lines = [breaker, s, breaker]
    # get the description trait
    desc = cls.class_traits().get("description")
    if desc:
        desc = desc.default_value
    if not desc:
        # no description from trait, use __doc__
        desc = getattr(cls, "__doc__", "")
    if desc:
        lines.append(c(desc))
        lines.append("")

    for name, trait in sorted(cls.class_traits(config=True).items()):
        default_repr = trait.default_value_repr()

        if classes:
            defining_class = cls._defining_class(trait, classes)
        else:
            defining_class = cls
        if defining_class is cls:
            # cls owns the trait, show full help
            if trait.help:
                lines.append(c(trait.help))
            if "Enum" in type(trait).__name__:
                # include Enum choices
                lines.append("#  Choices: %s" % trait.info())
            lines.append("#  Default: %s" % default_repr)
        else:
            # Trait appears multiple times and isn't defined here.
            # Truncate help to first line + "See also Original.trait"
            if trait.help:
                lines.append(c(trait.help.split("\n", 1)[0]))
            lines.append(f"#  See also: {defining_class.__name__}.{name}")

        lines.append(f"# c.{cls.__name__}.{name} = {default_repr}")
        lines.append("")
    return "\n".join(lines)
